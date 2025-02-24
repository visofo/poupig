'use client'
import { CategoriaDTO } from 'adapters'
import { core } from '../../adapters'
import { createContext, useEffect, useRef, useState } from 'react'
import { FiltrarCategorias } from 'core'
import categoriasPadroes from '../constants/categorias'
import useCentralDeAcesso from '../hooks/useCentralDeAcesso'

export interface CategoriasContextProps {
    categoriasAgrupadas: CategoriaDTO[]
    categorias: CategoriaDTO[]
    salvarCategoria: (categoria: CategoriaDTO) => Promise<void>
    excluirCategoria: (categoria: CategoriaDTO) => Promise<void>
    preencherCategoriasPadroes: () => Promise<void>
    filtrarCategorias: (filtro: string) => CategoriaDTO[]
    nomeCategoria: (categoriaId?: string | null) => string
}

const CategoriasContext = createContext<CategoriasContextProps>({} as any)

export function CategoriasProvider(props: any) {
    const { usuario } = useCentralDeAcesso()
    const categoriasRef = useRef<CategoriaDTO[]>([])
    const [categoriasAgrupadas, setCategoriasAgrupadas] = useState<CategoriaDTO[]>([])

    useEffect(() => {
        consultarCategorias()
    }, [usuario])

    async function salvarCategoria(categoria: CategoriaDTO) {
        if (!usuario || !categoriasAgrupadas) return
        await core.categoria.salvar(usuario, categoria)
        await consultarCategorias()
    }

    async function excluirCategoria(categoria: CategoriaDTO) {
        if (!usuario || !categoriasAgrupadas) return
        await core.categoria.excluir(usuario, categoria)
        await consultarCategorias()
    }

    async function preencherCategoriasPadroes() {
        if (!usuario) return
        await core.categoria.salvarTodas(usuario, categoriasPadroes)
        await consultarCategorias()
    }

    async function consultarCategorias() {
        if (!usuario) return
        const categorias = await core.categoria.consultar(usuario)
        setCategoriasAgrupadas(categorias)
        categoriasRef.current = _categoriasFlat(categorias)
    }

    function filtrarCategorias(pesquisa: string) {
        return core.categoria.filtrar(pesquisa, categoriasAgrupadas)
    }

    function nomeCategoria(categoriaId?: string | null) {
        if (!categoriaId) return ''
        const categoria = categoriasRef.current.find((cat) => cat.id === categoriaId)
        return categoria?.pai ? `${categoria.pai.nome}/${categoria.nome}` : categoria?.nome ?? ''
    }

    function _categoriasFlat(categoriasAgrupadas: CategoriaDTO[]) {
        return categoriasAgrupadas.reduce((todas: CategoriaDTO[], cat: CategoriaDTO) => {
            return [...todas, cat, ...(cat.subcategorias ?? [])]
        }, [])
    }

    return (
        <CategoriasContext.Provider
            value={{
                categoriasAgrupadas,
                get categorias() {
                    return categoriasRef.current
                },
                salvarCategoria,
                excluirCategoria,
                preencherCategoriasPadroes,
                filtrarCategorias,
                nomeCategoria,
            }}
        >
            {props.children}
        </CategoriasContext.Provider>
    )
}

export default CategoriasContext
